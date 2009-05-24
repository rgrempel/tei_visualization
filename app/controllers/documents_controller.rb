class DocumentsController < ApplicationController
  def create
    data = params[:request][:data][:documents]
    @record = Document.new(data)

    @scholar = current_scholar
    if @scholar
      @record.scholar_id = @scholar.id
      if @record.save
        @status = 0
      else
        @status = -4
      end
    else
      @status = -4
      @record.errors.add :body, "You must log in to upload a document"
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
      if current_scholar
        if current_scholar.administrator? || (current_scholar.id == @record.scholar_id)
          @record.destroy
          @status = 0
          render :template => "smartclient/show"
        else
          response = <<-END
            <response>
              <status>-1</status>
              <data>You are not allowed to delete this item</data>
            </response>
          END
          render :xml => response
        end
      else
        response = <<-END
          <response>
            <status>-1</status>
            <data>You must log in to delete items</data>
          </response>
        END
        render :xml => response
      end
    else
      response = <<-END
        <response>
          <status>-1</status>
          <data>Item not found</data>
        </response>
      END
      render :xml => response
    end
  end

  def show
    @record = Document.find params[:id]
    if @record
      respond_to do |format|
        format.tei do
          send_file @record.contents.path, :x_sendfile => (Rails.env != "development"), :type => :xml
        end
      end
    end
  end

  def upload
    @callback = params[:callback]
    @record = Document.new(params)

    @scholar = current_scholar
    if @scholar
      @record.scholar_id = @scholar.id
      if @record.save
        @status = 0
      else
        @status = -4
      end
    else
      @status = -4
      @record.errors.add :body, "You must log in to upload a document"
    end

    render :layout => false
  end
end
