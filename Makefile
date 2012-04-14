all:
	@echo "Targets: bundle, db, run, tmpl, css, cssd, optimize"

bundle:
	bundle install

db:
	bundle exec rake db:migrate

run:
	bundle exec ruby dlt.rb

tmpl:
	make -C public/tmpl

css:
	make -C public/css

cssd:
	make -C public/css watch

optimize:
	make -C tools optimize

.PHONY: all bundle db run tmpl css cssd
