# This file is auto-generated from the current state of the database. Instead of editing this file, 
# please use the migrations feature of Active Record to incrementally modify your database, and
# then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your database schema. If you need
# to create the application database on another system, you should be using db:schema:load, not running
# all the migrations from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20090525033350) do

  create_table "documents", :force => true do |t|
    t.string   "original_url"
    t.string   "title"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "contents_file_name"
    t.string   "contents_content_type"
    t.integer  "contents_file_size"
    t.datetime "contents_updated_at"
    t.integer  "scholar_id"
    t.boolean  "allow_public",          :default => true
  end

  add_index "documents", ["scholar_id"], :name => "index_documents_on_scholar_id"

  create_table "scholars", :force => true do |t|
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
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "scholars", ["email"], :name => "index_scholars_on_email", :unique => true
  add_index "scholars", ["last_request_at"], :name => "index_scholars_on_last_request_at"
  add_index "scholars", ["persistence_token"], :name => "index_scholars_on_persistence_token"

end
