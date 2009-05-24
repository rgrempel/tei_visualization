# == Schema Information
#
# Table name: scholars
#
#  id                 :integer         not null, primary key
#  email              :string(255)     not null
#  institution        :string(255)     not null
#  full_name          :string(255)     not null
#  crypted_password   :string(255)     not null
#  password_salt      :string(255)     not null
#  activated_at       :datetime
#  persistence_token  :string(255)     not null
#  perishable_token   :string(255)     not null
#  login_count        :integer         default(0), not null
#  failed_login_count :integer         default(0), not null
#  last_request_at    :datetime
#  current_login_at   :datetime
#  last_login_at      :datetime
#  current_login_ip   :string(255)
#  last_login_ip      :string(255)
#  administrator      :boolean
#  created_at         :datetime
#  updated_at         :datetime
#

require File.join(File.dirname(__FILE__), '..', 'test_helper')

class ScholarTest < ActiveSupport::TestCase
  test "email should be sanitized" do
    u = Scholar.new :email => "rgrempel@gmail.com",
                    :full_name => "<b>Ryan Rempel</b>",
                    :institution => "CMU"
    u.password = "abcd12345"
    u.password_confirmation = "abcd12345"

    assert u.save, "Should have saved record"
    assert_equal "Ryan Rempel", u.full_name, "Should have stripped tags from full_name"
  end
end
