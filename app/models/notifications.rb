class Notifications < ActionMailer::Base
  def password_reset_instructions(user)
    subject    'tei.pauldyck.com password reset instructions'
    recipients user.email
    from       'Password Reset <noreply@pauldyck.com>'
    sent_on    Time.now

    body       :user => user
  end

  def account_confirmation_instructions(user)
    subject    'tei.pauldyck.com Account Confirmation Instructions'
    recipients user.email
    from       'Account Confirmation <noreply@pauldyck.com>'
    sent_on    Time.now

    body       :user => user
  end
end
