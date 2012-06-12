FactoryGirl.define do
  sequence(:email) { |n| "user-#{n}@example.com" }
  sequence(:alias) { |n| "user#{n}" }

  factory :user do
    sequence(:name) { |n| "John Doe #{n}" }
    email
    alias
    password "moo"
  end

  factory :project do
    sequence(:name) { |n| "Project #{n}" }
  end

  factory :task do
    sequence(:summary) { |n| "Task #{n}" }
  end
end
