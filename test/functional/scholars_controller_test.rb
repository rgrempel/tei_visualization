require File.join(File.dirname(__FILE__), '..', 'test_helper')

class ScholarsControllerTest < ActionController::TestCase
  setup :activate_authlogic

  def wrap_sc_params params={}
    {
      :format => :sc,
      :request => {
        :data => {
          :scholars => params
        }
      }
    }
  end

  context "Anyone" do
    should "be able to register" do
      post :create, wrap_sc_params(
        :email => "rgrempel@gmail.com",
        :full_name => "Ryan Rempel",
        :institution => "CMU",
        :password => "12345",
        :password_confirmation => "12345"
      )

      assert_response :success
      assert_equal 1, Scholar.count, "Should be 1 scholar now"
      @scholar = Scholar.find_by_email "rgrempel@gmail.com"
      assert_not_nil @scholar, "Should have set email"
      assert_sent_email
      assert_nil @scholar.activated_at, "Should not be activated yet"
      assert_nil @controller.session[:scholar_credentials], "Should not be logged in"
    end
  end
end
