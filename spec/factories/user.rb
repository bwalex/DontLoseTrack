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
  end

  factory :task do
    sequence(:summary) { |n| "Task #{n}" }
  end
end
