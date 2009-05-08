xml.instruct! :xml, :version => '1.0', :encoding => 'UTF-8'

xml.response do
  xml.status @status
  xml << @record.errors.to_smartclient.to_xml({
    :skip_instruct => true,
    :skip_types => true,
    :root => "errors",
    :dasherize => false
  })
  xml.data do
    xml << @record.to_xml({
      :skip_instruct => true,
      :skip_types => true,
      :root => "record",
      :dasherize => false
    }.merge(@toxml_options || {}))
  end
end
