# Based on "Yaffle", http://danieltsadok.wordpress.com/2010/04/06/understanding-rails-plugins/

module Stripper
  #class methods
  def strip *fields
    self.cattr_accessor :stripper_fields
    self.stripper_fields = fields
    before_validation :stripper_strip
    send :include, InstanceMethods
  end

  module InstanceMethods
    def stripper_strip
      self.stripper_fields.each do |f|
        s = read_attribute(f).strip
        write_attribute(f, s)
      end
    end
  end
end

ActiveRecord::Base.send :extend, Stripper





class EmailValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    unless value =~ /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i
      record.errors[attribute] << (options[:message] || "is not an email")
    end
  end
end






class ActiveRecord::RecordInvalid
  def errors_to_a
    a = []

    record.errors.each do |k, v|
      a.push(k.to_s.split("_").each{|w| w.capitalize!}.join(" ") + " " + v);
    end

    return a
  end

  def errors_to_json
    { "errors" => errors_to_a }.to_json
  end
end

