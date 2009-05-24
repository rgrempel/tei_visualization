require File.join(File.dirname(__FILE__), '..', 'test_helper')

class ScholarSessionTest < ActiveSupport::TestCase
  setup :activate_authlogic

  context "Given a scholar who is not activated, " do
    setup do
      @scholar = Scholar.new({
        :email => "rgrempel@gmail.com",
        :full_name => "Ryan Rempel",
        :institution => "CMU"
      });
      @scholar.password = "12345"
      @scholar.password_confirmation = "12345"
      @scholar.reset_perishable_token
      @scholar.save
    end

    should "not be able to log in with password" do
      assert_equal 1, Scholar.count, "Should have created a scholar"

      session = ScholarSession.new :email => "rgrempel@gmail.com", :password => "12345"
      assert !session.save, "Should have failed saving session"
    end

    should "be able to log in with password once activated" do
      @scholar.activated_at = Time.now
      @scholar.save

      session = ScholarSession.new :email => "rgrempel@gmail.com", :password => "12345"
      assert session.save, "Should be able to log in with password now"
    end
  end
end
