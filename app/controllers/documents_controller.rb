class DocumentsController < ApplicationController
  def create
    data = params[:request][:data][:documents]
    @record = Document.new(data)

    if @record.save
      @status = 0
    else
      @status = -4
    end

    render :template => "smartclient/show"
  end

  def index
    options = {
      :order => "title DESC"
    }

    if params.has_key?(:_startRow)
      @startRow = params[:_startRow].to_i
      options[:offset] = @startRow
      options[:limit] = params[:_endRow].to_i - @startRow + 1
    else
      @startRow = 0
    end

    @records = Document.find :all, options

    @status = 0

    [:offset, :limit, :order].each do |option|
      options.delete option
    end

    @totalRows = Document.count options
    @endRow = @startRow + @records.length - 1

    render :template => "smartclient/index"
  end

  def upload
    @callback = params[:callback]
    @response = {}

    render :layout => false
  end
end
