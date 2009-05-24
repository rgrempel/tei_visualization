class CreateScholars < ActiveRecord::Migration
  def self.up
    create_table :scholars do |t|
      t.string   "email",                             :null => false
      t.string   "institution",                       :null => false
      t.string   "full_name",                         :null => false
      t.string   "crypted_password",                  :null => false
      t.string   "password_salt",                     :null => false
      t.datetime "activated_at"
      t.string   "persistence_token",                 :null => false
      t.string   "perishable_token",                  :null => false
      t.integer  "login_count",        :default => 0, :null => false
      t.integer  "failed_login_count", :default => 0, :null => false
      t.datetime "last_request_at"
      t.datetime "current_login_at"
      t.datetime "last_login_at"
      t.string   "current_login_ip"
      t.string   "last_login_ip"
      t.boolean  "administrator"
      t.timestamps
    end

    add_index "scholars", ["email"], :name => "index_scholars_on_email", :unique => true
    add_index "scholars", ["last_request_at"], :name => "index_scholars_on_last_request_at"
    add_index "scholars", ["persistence_token"], :name => "index_scholars_on_persistence_token"
  end

  def self.down
    drop_table :scholars
  end
end
