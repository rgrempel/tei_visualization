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

class Scholar < ActiveRecord::Base
  sanitize_fields :only => [:email, :institution, :full_name]

  acts_as_authentic do |c|
    c.perishable_token_valid_for 1.day
  end

  attr_accessible :email, :institution, :full_name

  def deliver_password_reset_instructions!
    reset_perishable_token!
    Notifications.deliver_password_reset_instructions(self)
  end

  def deliver_account_confirmation_instructions!
    reset_perishable_token!
    Notifications.deliver_account_confirmation_instructions(self)
  end
end
