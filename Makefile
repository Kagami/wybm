NAME = wybm
VERSION := $(shell npm -j version | awk -F '"' '/"wybm"/{print $$4}')
ZIP_OPTS = -tzip -mx=9
7Z_OPTS = -t7z -m0=lzma2 -mx=9
DIST_DIR = dist
APP = app.nw
LIN64_NW_DIR = bin/nwjs-v0.18.3-linux-x64
LIN64_RELEASE = $(NAME)-v$(VERSION)-linux-x64
LIN64_RELEASE_DIR = $(DIST_DIR)/$(LIN64_RELEASE)
LIN64_7Z = $(LIN64_RELEASE).7z
WIN32_NW_DIR = bin/nwjs-v0.18.3-win-ia32
WIN32_RELEASE = $(NAME)-v$(VERSION)-win-x86
WIN32_RELEASE_DIR = $(DIST_DIR)/$(WIN32_RELEASE)
WIN32_7Z = $(WIN32_RELEASE).7z

all:

lin64:
	cd "$(DIST_DIR)" && rm -rf "$(APP)" "$(LIN64_RELEASE)" "$(LIN64_7Z)"
	cd "$(DIST_DIR)/app" && 7z a $(ZIP_OPTS) "../$(APP)" *
	mkdir -p "$(LIN64_RELEASE_DIR)"
	cp -a "$(LIN64_NW_DIR)"/* "$(LIN64_RELEASE_DIR)"
	cat "$(LIN64_RELEASE_DIR)/nw" "$(DIST_DIR)/$(APP)" > "$(LIN64_RELEASE_DIR)/$(NAME)"
	rm "$(LIN64_RELEASE_DIR)/nw"
	chmod +x "$(LIN64_RELEASE_DIR)/$(NAME)"
	cp -a legal "$(LIN64_RELEASE_DIR)"
	cd "$(DIST_DIR)" && 7z a $(7Z_OPTS) "$(LIN64_7Z)" "$(LIN64_RELEASE)"

win32:
	cd "$(DIST_DIR)" && rm -rf "$(APP)" "$(WIN32_RELEASE)" "$(WIN32_7Z)"
	cd "$(DIST_DIR)/app" && 7z a $(ZIP_OPTS) "../$(APP)" *
	mkdir -p "$(WIN32_RELEASE_DIR)"
	cp -a "$(WIN32_NW_DIR)"/* "$(WIN32_RELEASE_DIR)"
	cat "$(WIN32_RELEASE_DIR)/nw.exe" "$(DIST_DIR)/$(APP)" > "$(WIN32_RELEASE_DIR)/$(NAME).exe"
	rm "$(WIN32_RELEASE_DIR)/nw.exe"
	cp -a legal "$(WIN32_RELEASE_DIR)"
	cd "$(DIST_DIR)" && 7z a $(7Z_OPTS) "$(WIN32_7Z)" "$(WIN32_RELEASE)"
