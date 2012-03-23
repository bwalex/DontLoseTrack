FORMAT?= html5
STYLE?= ugly

all:
	haml -f $(FORMAT) -t $(STYLE) foo.haml  | tr -d '\n' > test.tmpl
	haml -f $(FORMAT) -t $(STYLE) note.haml | tr -d '\n' > note.tmpl
	haml -f $(FORMAT) -t $(STYLE) task.haml | tr -d '\n' > task.tmpl
	haml -f $(FORMAT) -t $(STYLE) tag.haml  | tr -d '\n' > tag.tmpl
