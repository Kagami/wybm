@echo off
if not exist WybmAppData\NUL (
	mkdir WybmAppData
	echo {"plugins":{"resource_cache_update":"2000000000.0"}}> "WybmAppData\Local State"
)
start nw.exe app.nw