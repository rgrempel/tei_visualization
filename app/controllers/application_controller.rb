# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  helper :all # include all helpers, all the time
  helper_method :current_scholar_session, :current_scholar
  # protect_from_forgery # See ActionController::RequestForgeryProtection for details

  # Scrub sensitive parameters from your log
  filter_parameter_logging :password

  before_filter :checkIsomorphicDebug

  def checkIsomorphicDebug
    @isomorphicDebug = params.has_key?(:isomorphicDebug)
  end

  def current_scholar_session
    return @current_scholar_session if defined?(@current_scholar_session)
    @current_scholar_session = ScholarSession.find
  end

  def current_scholar
    return @current_scholar if defined?(@current_scholar)
    @current_scholar = current_scholar_session && current_scholar_session.record
  end

  def require_scholar
    unless current_scholar
      respond_to do |format|
        format.sc do
          response = <<-END
            <response>
              <status>-1</status>
              <data>You must login to view this item</data>
            </response>
          END
          render :xml => response, :status => 403
        end

        format.all do
          render :text => "You must login to view this item", :status => 403
        end
      end

      return false
    end
  end

  def require_no_scholar
    if current_scholar
      store_location
      flash[:notice] = "You must be logged out to access this page"
      redirect_to account_url
      return false
    end
  end

  def store_location
    session[:return_to] = request.request_uri
  end

  def redirect_back_or_default(default)
    redirect_to(session[:return_to] || default)
    session[:return_to] = nil
  end
end
