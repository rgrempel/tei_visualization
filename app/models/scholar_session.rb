class ScholarSession < Authlogic::Session::Base
  self.find_by_login_method = :find_by_email
  self.login_field = :email

  validate :check_activation

  def check_activation
    return true if attempted_record.nil?

    if attempted_record.activated_at.nil?
      errors.add_to_base("Your account has not been activated yet ... check for an email with the activation code")
      return false
    end
    true
  end

  def to_xml options={}
    credentials.to_xml options
  end
end
