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
#  scholar_id            :integer
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

    should "pick up TEI title if not specified" do
      document = Document.new :contents => @file
      document.save

      assert_equal "Pride and Prejudice: An electronic edition", document.title
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
    
  context "Given a valid non-TEI file," do
    setup do
      @file = File.new(File.join(Rails.root, "test", "fixtures", "documents", "PrideAndPrejudiceNotTei.xml"))
    end

    teardown do
      @file.close
    end
  
    should "get errors when saving attachment" do
      document = Document.new :contents => @file,
                              :title => "A title"
      assert !document.save, "Should have had errors on save"
    end
  end

  context "When given a url to download," do
    should "automatically fetch and save a valid TEI document" do
      document = Document.new :original_url => "http://www.google.ca/index.html",
                              :title => "A title"
      assert !document.save, "Should have had errors on save"
      assert document.contents_file_size > 0, "Should have retrieved document"
    end
  end
end
