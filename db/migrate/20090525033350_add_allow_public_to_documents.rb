class AddAllowPublicToDocuments < ActiveRecord::Migration
  def self.up
    add_column :documents, :allow_public, :boolean, :default => true
  end

  def self.down
    remove_column :documents, :allow_public
  end
end
