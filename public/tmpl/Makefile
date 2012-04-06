FORMAT?= html5
STYLE?= ugly

TEMPLATES= $(patsubst %.haml,%.tmpl,$(wildcard *.haml))

all: $(TEMPLATES)
	cat *.tmpl > all.templates

%.tmpl: %.haml
	haml -f $(FORMAT) -t $(STYLE) $*.haml  | tr -d '\n' > $@

clean:
	rm -f *.tmpl
	rm -f all.templates
