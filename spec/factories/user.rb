require 'lorem'

FactoryGirl.define do
  sequence(:email) { |n| "user-#{n}@example.com" }

  factory :user do
    sequence(:name) { |n| "John Doe #{n}" }
    email
    sequence(:alias) { |n| "user#{n}" }
    new_password "moo"
    new_password_confirmation { |u| u.new_password }
  end

  factory :project do
    sequence(:name) { |n| "Project #{n}" }
    association :owner, factory: :user
  end

  factory :tag do
    sequence(:name) { |n| "Tag #{n}" }
    color
  end

  factory :task do
    sequence(:summary) { |n| "Task #{n}" }
    association :project
  end

  factory :note do
    sequence(:text) { |n| "Note #{n}" }
    association :project
    association :user
  end

  factory :wiki do
    sequence(:title) { |n| "Wiki #{n}" }
    association :project
  end

  factory :wiki_content do
    sequence(:comment) { |n| "Change #{n}" }
    sequence(:text) { |n| Lorem::Base.new('paragraphs', 5).output }
    association :wiki
    association :user
  end
end
