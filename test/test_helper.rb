ENV["RAILS_ENV"] = "test"
require File.expand_path(File.dirname(__FILE__) + "/../config/environment")
require 'test_help'

class ActiveSupport::TestCase
  self.use_transactional_fixtures = true
  self.use_instantiated_fixtures  = false

  fixtures :all

  def setup
    super
    FileUtils.rm_r File.join(Rails.root, 'tmp', 'paperclip'), :force => true
  end
end
