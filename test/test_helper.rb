ENV["RAILS_ENV"] = "test"
require File.expand_path(File.dirname(__FILE__) + "/../config/environment")
require 'test_help'
require 'authlogic/test_case'

class ActiveSupport::TestCase
  self.use_transactional_fixtures = true
  self.use_instantiated_fixtures  = false

  fixtures :all

  def setup
    super
    FileUtils.rm_r File.join(Rails.root, 'tmp', 'paperclip'), :force => true
  end

  def wrap_sc_params datasource, params={}
    {
      :format => :sc,
      :request => {
        :data_source => datasource.to_s,
        :data => {
          datasource.to_sym => params
        }
      }
    }
  end
end
