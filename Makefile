# TODO(Kagami): Use nw-builder.

NAME = wybm
VERSION := $(shell npm -j version | awk -F '"' '/"wybm"/{print $$4}')
DIST_DIR = dist
LIN64_APP = app-lin64-v$(VERSION).nw
LIN64_RELEASE = $(NAME)-lin64-v$(VERSION)
LIN64_RELEASE_DIR = $(DIST_DIR)/$(LIN64_RELEASE)
LIN64_ZIP = $(NAME)-lin64-v$(VERSION).7z
WIN32_APP = app-win32-v$(VERSION).nw
WIN32_RELEASE = $(NAME)-win32-v$(VERSION)
WIN32_RELEASE_DIR = $(DIST_DIR)/$(WIN32_RELEASE)
WIN32_ZIP = $(NAME)-win32-v$(VERSION).7z
# Appending zip to the executable is not supported in beta2.
LINUX_RUNNER = wybm.sh
WINDOWS_RUNNER = wybm.bat

all:

lin64:
ifndef LIN64_NW_DIR
	$(error LIN64_NW_DIR is not set)
endif
	cd "$(DIST_DIR)/app" && zip -r "../$(LIN64_APP)" *
	rm -rf "$(LIN64_RELEASE_DIR)"
	mkdir -p "$(LIN64_RELEASE_DIR)"
	cp -a "$(LIN64_NW_DIR)"/* "$(LIN64_RELEASE_DIR)"
	mv "$(LIN64_RELEASE_DIR)/nw" "$(LIN64_RELEASE_DIR)/.nw"
	cp -a "$(DIST_DIR)/$(LIN64_APP)" "$(LIN64_RELEASE_DIR)/app.nw"
	cp -a "$(LINUX_RUNNER)" "$(LIN64_RELEASE_DIR)/$(NAME)"
	chmod +x "$(LIN64_RELEASE_DIR)/$(NAME)"
	cd "$(DIST_DIR)" && 7z a "$(LIN64_ZIP)" "$(LIN64_RELEASE)"

win32:
ifndef WIN32_NW_DIR
	$(error WIN32_NW_DIR is not set)
endif
	cd "$(DIST_DIR)/app" && zip -r "../$(WIN32_APP)" *
	rm -rf "$(WIN32_RELEASE_DIR)"
	mkdir -p "$(WIN32_RELEASE_DIR)"
	cp -a "$(WIN32_NW_DIR)"/* "$(WIN32_RELEASE_DIR)"
	cp -a "$(DIST_DIR)/$(WIN32_APP)" "$(WIN32_RELEASE_DIR)/app.nw"
	cp -a "$(WINDOWS_RUNNER)" "$(WIN32_RELEASE_DIR)"
	cd "$(DIST_DIR)" && 7z a "$(WIN32_ZIP)" "$(WIN32_RELEASE)"
