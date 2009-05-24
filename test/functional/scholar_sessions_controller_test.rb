require File.join(File.dirname(__FILE__), '..', 'test_helper')

class ScholarSessionsControllerTest < ActionController::TestCase
  setup :activate_authlogic

  def setup
    super

    @scholar = Scholar.new({
      :email => "rgrempel@gmail.com",
      :full_name => "Ryan Rempel",
      :institution => "CMU"
    });

    @scholar.password = "12345"
    @scholar.password_confirmation = "12345"
    @scholar.reset_perishable_token
    @scholar.save!
  end

  context "A scholar who is not activated" do
    should "not be able to login with password" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :email => "rgrempel@gmail.com",
          :password => "12345"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :errors, :child => {:tag => "base", :content => /not been activated/}
      assert_nil @controller.session[:scholar_credentials]
    end

    should "be able to activate with perishable_token" do
      assert_nil @scholar.activated_at

      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => @scholar.perishable_token
        }
      )

      assert_response :success
      assert_tag :status, :content => "0"
      assert_tag :record, :child => {:tag => "email", :content => @scholar.email}

      @scholar.reload

      assert_not_nil @scholar.activated_at, "activated_at should now be set"
      assert_not_nil @controller.session[:scholar_credentials], "should have been logged in"
    end

    should "not be able to activate with wrong perishable_token" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => "perishable_token"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :perishable_token, :content => /not found/

      @scholar.reload

      assert_nil @scholar.activated_at, "activated_at should not be set"
      assert_nil @controller.session[:scholar_credentials], "should not have been logged in"
    end

    should "be able to request a password reset code" do
      post :create, wrap_sc_params(
        :password_reset, {
          :email => "rgrempel@gmail.com"
        }
      )

      assert_response :success
      assert_tag :status, :content => "0"

      @scholar.reload
      assert_nil @scholar.activated_at, "should not be activated yet"
      assert_nil @controller.session[:scholar_credentials], "should not be logged in"

      assert_sent_email
    end

    should "be able to activate and reset password" do
      assert_nil @scholar.activated_at

      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => @scholar.perishable_token,
          :password => "23456",
          :password_confirmation => "23456"
        }
      )

      assert_response :success
      assert_tag :status, :content => "0"

      @scholar.reload
      assert_not_nil @scholar.activated_at, "Should be activated now"
      assert_not_nil @controller.session[:scholar_credentials], "should be logged in"

      session = ScholarSession.new(
        :email => @scholar.email,
        :password => "23456"
      )
      assert session.save, "Should be able to log in with new password now"
    end

    should "not be able to activate and reset password with wrong token" do
      assert_nil @scholar.activated_at

      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => "wrong token",
          :password => "23456",
          :password_confirmation => "23456"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"

      @scholar.reload
      assert_nil @scholar.activated_at, "Should not be activated now"
      assert_nil @controller.session[:scholar_credentials], "should not be logged in"

      session = ScholarSession.new(
        :email => @scholar.email,
        :password => "23456"
      )
      assert !session.save, "Should not be able to log in with new password now"
    end
  end

  context "A non-existent scholar" do
    should "not be able to request a password reset code" do
      post :create, wrap_sc_params(
        :password_reset, {
          :email => "noone@gmail.com"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_equal 0, ActionMailer::Base.deliveries.size, "should not have sent email"
    end

    should "not be able to login with password" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :email => "noone@gmail.com",
          :password => "12345"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :errors, :child => {:tag => "email", :content => /not exist/}
      assert_nil @controller.session[:scholar_credentials]
    end

    should "not be able to activate with perishable_token" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => "perishable_token"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :perishable_token, :content => /not found/
    end
  end

  context "A scholar who has activated" do
    setup do
      @scholar.activated_at = Time.now
      @scholar.save
    end

    should "be able to login with password" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :email => "rgrempel@gmail.com",
          :password => "12345"
        }
      )

      assert_response :success
      assert_tag :status, :content => "0"
      assert_tag :record, :child => {:tag => "email", :content => "rgrempel@gmail.com"}
      assert_not_nil @controller.session[:scholar_credentials]
    end

    should "not be able to login with wrong password" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :email => "rgrempel@gmail.com",
          :password => "wrong password"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :errors, :child => {:tag => "password", :content => /not valid/}
      assert_nil @controller.session[:scholar_credentials]
    end

    should "be able to request a password reset code" do
      post :create, wrap_sc_params(
        :password_reset, {
          :email => "rgrempel@gmail.com"
        }
      )

      assert_response :success
      assert_tag :status, :content => "0"

      @scholar.reload
      assert_nil @controller.session[:scholar_credentials], "should not be logged in"

      assert_sent_email
    end

    should "be able to reset password" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => @scholar.perishable_token,
          :password => "23456",
          :password_confirmation => "23456"
        }
      )

      assert_response :success
      assert_tag :status, :content => "0"

      @scholar.reload
      assert_not_nil @controller.session[:scholar_credentials], "should be logged in"

      session = ScholarSession.new(
        :email => @scholar.email,
        :password => "23456"
      )
      assert session.save, "Should be able to log in with new password now"
    end

    should "not be able to reset password if confirmation fails to match" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => @scholar.perishable_token,
          :password => "23456",
          :password_confirmation => "34567"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :password, :content => /doesn't match/

      @scholar.reload
      assert_nil @controller.session[:scholar_credentials], "should be logged in"

      session = ScholarSession.new(
        :email => @scholar.email,
        :password => "23456"
      )
      assert !session.save, "Should not be able to log in with new password now"
    end

    should "not be able to reset password to a single character" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => @scholar.perishable_token,
          :password => "a",
          :password_confirmation => "a"
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :password, :content => /too short/

      @scholar.reload
      assert_nil @controller.session[:scholar_credentials], "should be logged in"

      session = ScholarSession.new(
        :email => @scholar.email,
        :password => "a"
      )
      assert !session.save, "Should not be able to log in with new password now"
    end

    should "not be able to reset password to blank" do
      post :create, wrap_sc_params(
        :scholar_sessions, {
          :perishable_token => @scholar.perishable_token,
          :password => "",
          :password_confirmation => ""
        }
      )

      assert_response :success
      assert_tag :status, :content => "-4"
      assert_tag :password, :content => /is required/

      @scholar.reload
      assert_nil @controller.session[:scholar_credentials], "should be logged in"

      session = ScholarSession.new(
        :email => @scholar.email,
        :password => ""
      )
      assert !session.save, "Should not be able to log in with new password now"
    end
  end
end
