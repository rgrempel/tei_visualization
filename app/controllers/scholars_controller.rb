class ScholarsController < ApplicationController
  def create
    data = params[:request][:data][:scholars]
    @record = Scholar.new(data)
    @record.password = data[:password]
    @record.password_confirmation = data[:password_confirmation]

    @toxml_options = {:only => [:id, :email, :full_name, :institution]}

    if @record.save
      @status = 0
      @record.deliver_account_confirmation_instructions!
    else
      @status = -4
    end

    render :template => "smartclient/show"
  end
end
