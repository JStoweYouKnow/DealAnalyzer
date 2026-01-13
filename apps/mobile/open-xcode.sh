#!/bin/bash
# Script to open Xcode workspace
cd "$(dirname "$0")/ios"
open -a Xcode TheComfortFinder.xcworkspace
echo "Workspace opened. If Xcode doesn't show a window:"
echo "1. Check if Xcode is in your Dock - click it to bring it forward"
echo "2. Use Cmd+Tab to switch to Xcode"
echo "3. Check Window menu in Xcode for open windows"
