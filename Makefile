# TODO(Kagami): Use nw-builder.

NAME = wybm
VERSION := $(shell npm -j version | awk -F '"' '/"wybm"/{print $$4}')
DIST_DIR = dist
LIN64_NW_DIR = bin/nwjs-v0.13.0-beta3-linux-x64
LIN64_APP = app-v$(VERSION)-linux-x64.nw
LIN64_RELEASE = $(NAME)-v$(VERSION)-linux-x64
LIN64_RELEASE_DIR = $(DIST_DIR)/$(LIN64_RELEASE)
LIN64_ZIP = $(LIN64_RELEASE).7z
WIN32_NW_DIR = bin/nwjs-v0.13.0-beta3-win-ia32
WIN32_APP = app-v$(VERSION)-win-x86.nw
WIN32_RELEASE = $(NAME)-v$(VERSION)-win-x86
WIN32_RELEASE_DIR = $(DIST_DIR)/$(WIN32_RELEASE)
WIN32_ZIP = $(WIN32_RELEASE).7z
# Appending zip to the executable is not supported in beta2.
LINUX_RUNNER = wybm.sh
WINDOWS_RUNNER = wybm.bat

all:

lin64:
	cd "$(DIST_DIR)/app" && zip -r "../$(LIN64_APP)" *
	rm -rf "$(LIN64_RELEASE_DIR)"
	mkdir -p "$(LIN64_RELEASE_DIR)"
	cp -a "$(LIN64_NW_DIR)"/* "$(LIN64_RELEASE_DIR)"
	mv "$(LIN64_RELEASE_DIR)/nw" "$(LIN64_RELEASE_DIR)/.nw"
	cp -a "$(DIST_DIR)/$(LIN64_APP)" "$(LIN64_RELEASE_DIR)/app.nw"
	cp -a "$(LINUX_RUNNER)" "$(LIN64_RELEASE_DIR)/$(NAME)"
	chmod +x "$(LIN64_RELEASE_DIR)/$(NAME)"
	cp -a LICENSE.* "$(LIN64_RELEASE_DIR)"
	cd "$(DIST_DIR)" && 7z a "$(LIN64_ZIP)" "$(LIN64_RELEASE)"

win32:
	cd "$(DIST_DIR)/app" && zip -r "../$(WIN32_APP)" *
	rm -rf "$(WIN32_RELEASE_DIR)"
	mkdir -p "$(WIN32_RELEASE_DIR)"
	cp -a "$(WIN32_NW_DIR)"/* "$(WIN32_RELEASE_DIR)"
	cp -a "$(DIST_DIR)/$(WIN32_APP)" "$(WIN32_RELEASE_DIR)/app.nw"
	cp -a "$(WINDOWS_RUNNER)" "$(WIN32_RELEASE_DIR)"
	cp -a LICENSE.* "$(WIN32_RELEASE_DIR)"
	cd "$(DIST_DIR)" && 7z a "$(WIN32_ZIP)" "$(WIN32_RELEASE)"
