class CreateDocuments < ActiveRecord::Migration
  def self.up
    create_table :documents do |t|
      t.string :original_url
      t.string :title
      t.timestamps
    end
  end

  def self.down
    drop_table :documents
  end
end
