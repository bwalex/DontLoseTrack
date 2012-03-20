require 'rubygems'
require 'ostruct'

class RecursiveOpenStruct < OpenStruct
  def get_binding
    binding
  end

  def self.handle_object(object)
    object
  end

  def self.new_recursive(object)
    case object
    when Hash
      object = object.clone
      object.each do |key, value|
        object[key] = self.new_recursive(value)
      end
      self.new(object)
    when Array
      object = object.clone
      object.each_index do |key|
        object[key] = self.new_recursive(object[key])
      end
    else
      self.handle_object(object)
    end
  end
end
