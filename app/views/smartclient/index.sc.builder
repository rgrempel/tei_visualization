xml.instruct! :xml, :version => '1.0', :encoding => 'UTF-8'

xml.response do
  xml.status @status
  xml.totalRows @totalRows
  xml.startRow @startRow
  xml.endRow @endRow
  xml.data do
    @records.each do |record|
      xml << record.to_xml({
        :skip_instruct => true,
        :skip_types => true,
        :root => "record",
        :dasherize => false
      }.merge(@toxml_options || {}))
    end
  end
end
