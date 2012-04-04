FORMAT?= html5
STYLE?= ugly

all:
	haml -f $(FORMAT) -t $(STYLE) foo.haml  | tr -d '\n' > test.tmpl
	haml -f $(FORMAT) -t $(STYLE) note.haml | tr -d '\n' > note.tmpl
	haml -f $(FORMAT) -t $(STYLE) note-list.haml | tr -d '\n' > note-list.tmpl
	haml -f $(FORMAT) -t $(STYLE) task.haml | tr -d '\n' > task.tmpl
	haml -f $(FORMAT) -t $(STYLE) task-list.haml | tr -d '\n' > task-list.tmpl
	haml -f $(FORMAT) -t $(STYLE) taskdep.haml | tr -d '\n' > taskdep.tmpl
	haml -f $(FORMAT) -t $(STYLE) tag.haml  | tr -d '\n' > tag.tmpl
	haml -f $(FORMAT) -t $(STYLE) tag-list.haml  | tr -d '\n' > tag-list.tmpl
	haml -f $(FORMAT) -t $(STYLE) tag-norm.haml  | tr -d '\n' > tag-norm.tmpl
	haml -f $(FORMAT) -t $(STYLE) tag-applied.haml | tr -d '\n' > tag-applied.tmpl
	haml -f $(FORMAT) -t $(STYLE) navbar.haml | tr -d '\n' > navbar.tmpl
	haml -f $(FORMAT) -t $(STYLE) project-list.haml | tr -d '\n' > project-list.tmpl
	haml -f $(FORMAT) -t $(STYLE) project-link.haml | tr -d '\n' > project-link.tmpl
	haml -f $(FORMAT) -t $(STYLE) wiki-list.haml | tr -d '\n' > wiki-list.tmpl
	haml -f $(FORMAT) -t $(STYLE) wiki-overview.haml | tr -d '\n' > wiki-overview.tmpl
	haml -f $(FORMAT) -t $(STYLE) wiki.haml | tr -d '\n' > wiki.tmpl
	haml -f $(FORMAT) -t $(STYLE) wiki-edit.haml | tr -d '\n' > wiki-edit.tmpl
	haml -f $(FORMAT) -t $(STYLE) wiki-history.haml | tr -d '\n' > wiki-history.tmpl
	haml -f $(FORMAT) -t $(STYLE) wiki-history-entry.haml | tr -d '\n' > wiki-history-entry.tmpl
	haml -f $(FORMAT) -t $(STYLE) wiki-historic.haml | tr -d '\n' > wiki-historic.tmpl
