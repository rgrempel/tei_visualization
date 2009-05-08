# == Schema Information
#
# Table name: documents
#
#  id                    :integer         not null, primary key
#  original_url          :string(255)
#  title                 :string(255)
#  created_at            :datetime
#  updated_at            :datetime
#  contents_file_name    :string(255)
#  contents_content_type :string(255)
#  contents_file_size    :integer
#  contents_updated_at   :datetime
#

require 'nokogiri'
require 'open-uri'
require 'timeout'

class Document < ActiveRecord::Base
  FILE_PATH = Rails.env == "test" ? ":rails_root/tmp/paperclip/:class/:attachment/:id/:style/:basename.:extension" :
                                    ":rails_root/s3/paperclip/:class/:attachment/:id/:style/:basename.:extension"

  has_attached_file :contents, :path => FILE_PATH,
                               :styles => {:original => {}},
                               :processors => [:TEI],
                               :whiny_thumbnails => true

  attr_accessible :original_url, :title, :contents

  before_validation :download_from_original_url_if_necessary, :check_title
  
  validates_attachment_presence :contents
  validates_attachment_thumbnails :contents

  def download_from_original_url_if_necessary
    self.download_from_original_url unless self.contents.file?
    true
  end

  def check_title
    if self.title.blank?
      doc = Nokogiri::XML(self.contents.to_file.open)
      titleNode = doc.xpath(
        '/tei:TEI/tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title',
        'tei' => 'http://www.tei-c.org/ns/1.0'
      ).first
      self.title = titleNode ? titleNode.content : self.contents_file_name
    end
    true
  end

  # The support for downloading from url's is adapted from
  # http://almosteffortless.com/2008/12/11/easy-upload-via-url-with-paperclip/
  def download_from_original_url
    return if self.original_url.blank?

    self.contents = begin
      Timeout::timeout(300) do
        io = open(URI.parse(self.original_url))
        def io.original_filename
          base_uri.path.split('/').last
        end
        io.original_filename.blank? ? nil : io
      end
    rescue
      errors.add :original_url, "unable to download url"
      nil
    end
  end
end
