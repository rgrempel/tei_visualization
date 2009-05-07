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

require File.join(File.dirname(__FILE__), '..', 'test_helper')

class DocumentTest < ActiveSupport::TestCase
  context "Given a valid TEI file," do
    setup do
      @file = File.new(File.join(Rails.root, "test", "fixtures", "documents", "PrideAndPrejudice.xml"))
    end

    teardown do
      @file.close
    end

    should "be able to save an attachment" do
      document = Document.new :contents => @file,
                              :title => "A title"
      assert document.save, "Should have saved successfully"
      assert document.contents.file?, "Should have some contents"
    end
  end

  context "Given an invalid TEI file," do
    setup do
      @file = File.new(File.join(Rails.root, "test", "fixtures", "documents", "PrideAndPrejudiceInvalid.xml"))
    end

    teardown do
      @file.close
    end

    should "get errors when saving attachment" do
      document = Document.new :contents => @file,
                              :title => "A title"
      assert !document.save, "Should have had errors on save"
      assert document.new_record?, "Should still be new record"
    end
  end
end
