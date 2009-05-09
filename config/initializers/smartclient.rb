ActiveRecord::Errors.class_eval do
  def to_smartclient
    ret = {}
    each do |attr, msg|
      ret[attr] ||= []
      ret[attr] << msg
    end
    ret.each_pair do |key, value|
      ret[key] = value.join(", ")
    end
    ret
  end
end
