class ScholarSessionsController < ApplicationController
  before_filter :set_toxml_defaults

  def create
    if params[:request][:data_source] == "password_reset"
      handle_request_for_password_reset_code
    else
      @data = params[:request][:data][:scholar_sessions]
      if @data.has_key?(:perishable_token)
        handle_activation_or_password_reset
      else
        handle_login_attempt
      end
    end

    render :template => "smartclient/show"
  end

  def destroy
    if current_scholar_session
      @record = current_scholar
      current_scholar_session.destroy
      @status = 0
    else
      @status = -1
      @record = Scholar.new
    end

    render :template => "smartclient/show"
  end

  # This actually returns a singleton representing who is logged in ...
  def index
    @records = current_scholar ? [current_scholar] : []

    @status = 0
    @startRow = 0
    @endRow = @records.length - 1
    @totalRows = @records.length

    render :template => "smartclient/index"
  end

private
  def set_toxml_defaults
    @toxml_options = {:only => [:email, :id, :full_name, :institution]}
  end

  def handle_login_attempt
    session = ScholarSession.new @data
    if session.save
      @status = 0
      @record = session.attempted_record
    else
      @status = -4
      @record = session
      @toxml_options = {}
    end
  end

  def handle_activation_or_password_reset
    @record = Scholar.find_using_perishable_token(@data[:perishable_token])
    if @record
      if @data[:password]
        # ... an attempt to reset password ...
        if @data[:password].blank?
          @record.errors.add :password, "is required"
          @status = -4
        else
          @record.password = @data[:password]
          @record.password_confirmation = @data[:password_confirmation]
          @record.activated_at = Time.now unless @record.activated_at
          if @record.save
            @status = 0
            ScholarSession.create(@record)
          else
            @status = -4
          end
        end
      else
        # ... an activation ...
        @record.activated_at = Time.now unless @record.activated_at
        @record.save
        @status = 0

        ScholarSession.create(@record)
      end
    else
      # ... Could not find the perishable_token
      @record = Scholar.new
      @record.perishable_token = @data[:perishable_token]
      @status = -4
      @record.errors.add :perishable_token, "was not found in system ..."
    end
  end

  def handle_request_for_password_reset_code
    @data = params[:request][:data][:password_reset]
    # It's a password reset request, so we don't leak the real record ...
    @record = Scholar.new
    if @data[:email]
      scholar = Scholar.find_by_email @data[:email]
      if scholar
        scholar.deliver_password_reset_instructions!
        @status = 0
      else
        @record.errors.add :email, "was not found"
        @status = -4
      end
    else
      @record.errors.add :email, "is required"
      @status = -4
    end
  end
end
