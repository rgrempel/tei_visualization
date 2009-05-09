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
      :order => "title"
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

  def destroy
    @record = Document.find params[:id]
    if @record
      @record.destroy
      @status = 0
    else
      @status = -1
    end

    render :template => "smartclient/show"
  end

  def upload
    @callback = params[:callback]
    @record = Document.new(params)
    @status = @record.save ? 0 : -4

    render :layout => false
  end
end
