class AddScholarIdToDocument < ActiveRecord::Migration
  def self.up
    add_column :documents, :scholar_id, :integer
    add_index :documents, :scholar_id
  end

  def self.down
    remove_column :documents, :scholar_id
  end
end
