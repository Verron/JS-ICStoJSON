/*
 *  ICS Parser v0.0.1
 *	Author:			Verron Knowles
 *	Created:		02-19-2012
 *	Last-Modified:	03-13-2012
 *	Changes:		3-13-2012
 *						Redesigned the ICSParser.parse function
 * 							-Added proper concatenation of lines
 * 							-Added support for attributes within the option name portion
 *						Created ICSParser.camCase method
 * 						Options with hyphens will now follow the Camel Case notation
 * 							-i.e. X-MS-DATE-OBJECT will now be xMsDateObject
 * 						Bug Fixes
 * 							-000001 - Fix issue with null values appearing within object (Improper dig count)
 * 							-000002 - Fixed issue where a line feed would result in the parser breaking
 * 							-000003 - Fixed issue where continuous lines will contain unecessary spaces
 */
(function(){

	var 
	
	undefined;
	
	// File read support removed, application should provide ICS Data
	/* // File System Object OpenTextFile Options
	// Reading
	OTF_ForReading = 1,
	// Writing
	OTF_ForWriting = 2,
	// Appending
	OTF_ForAppending = 8,
	// Reference File Creation System Default
	OTF_TristateUseDefault = -2,
	// For Unicode
	OTF_TristateTrue = -1,
	// For ASCII
	OTF_TristateFalse = 0,
	
	// File Object
	ICS_FILE_OBJECT = new ActiveXObject('Scripting.FileSystemObject'),
	
	// Shell Application Object
	ICS_SHELL_APPLICATION = new ActiveXObject('Shell.Application'); */
	
	var ICSParser = this.ICSParser = function( icsData ) {
		
		var
		
		// Has the intro tag been declared yet?
		procCalendar = false;
		
		// No more than one embed at a time (have to review RFC
		
		// File read support removed, application should provide ICS Data
		// fileRef = ICS_FILE_OBJECT.OpenTextFile( icsFile, OTF_ForReading );
		// fileContent = fileRef.ReadAll();
		return ICSParser.parse(icsData);
	};
	
	ICSParser.date = this.ICSParser.date = function ( date, dash ) {
		var year = date.substr(0,4), month = date.substr(4,2), day = date.substr(6,2);
		if (dash == false) return month+day+year;
		return month+"-"+day+"-"+year;
	};
	
	ICSParser.trim = this.ICSParser.trim = function( text ) {
		return text == null ? "" : text.toString().replace(/^[\s\xA0]+/,'').replace(/[\s\xA0]+$/,'').replace(/(\r\n|\n|\r)/gm,'');
	};
	
	ICSParser.camCase = this.ICSParser.camCase = function( str ) {
		return str.match(/[\s,\-]/g) ? 
			(function(){
				tmp = str.split(/[\s,\-]/); rstr = tmp[0].toLowerCase();
				for ( z=1;tmp[z];z++ ) rstr += tmp[z].charAt(0).toUpperCase() + tmp[z].substr(1).toLowerCase();
				return rstr;
			})() : str.toLowerCase();
	};
	
	ICSParser.parse = this.ICSParser.parse = function( contents ) {
		
		var icsObj = {}, lines = contents.split("\n"), digger = "icsObj", digTrack = [], trackName = '', option, pLine = '', ccCheck;
		
		for( x=0;lines[x];x++ ) {
			
			// Build parsed line
			//pLine += lines[x];
			
			// Check if you should pull next line
			ccCheck = lines[x+1].charCodeAt(0);
			
			// Continue to add to parse line if next line begins with space/tab
			// Reference: RFC-?
			if ( ccCheck == 32 || ccCheck == 9 ) { // Modify pLine to remove extra spacing in line carries - Bug fix #000003
				pLine += ICSParser.trim(lines[x]);;
				continue;
			} else {
				pLine += ICSParser.trim(lines[x]);
			}
			// alert(lines[x].substr(0,1) + " - " + lines[x].charCodeAt(0));
			// Pass space-beginning lines directly to the current option
			
			// Retrieve opt/val setup
			var lineData = pLine.split(":");
			var option = lineData[0], value = ICSParser.trim(lineData.slice(1).join(":"));
			
			// Handle ICS dig
			if ( option == "BEGIN" ) {
				value = ICSParser.camCase(value);
				digger += "." + value;
				trackName = digger+"-"+value;
				digTrack[trackName] = digTrack[trackName] || 0;
				// alert("BEGIN:" + digTrack[trackName] + " - " + trackName);
				eval( digger + " == undefined ? " + digger + " = [{}] : " + digger + ";");
				eval( digger + "[" + digTrack[trackName] + "] = {}");
				digger += "[" + digTrack[trackName] + "]";
				pLine = '';
				continue;
			}
			
			// Handle ICS Receed
			if ( option == "END" ) {
				value = ICSParser.camCase(value);
				trackName = digger.replace(/\[[0-9]+\]$/,'')+"-"+value; // Remove last set of [] brackets - Bug fix #000001
				//alert(trackName);
				digTrack[trackName]++;
				tmpDig =  digger.split(".");
				tmpDig.pop();
				digger = tmpDig.join(".");
				//alert("END:" + digTrack[trackName] + " - " + trackName)
				pLine = '';
				continue
			}
			//alert(option + "\n\n" + value);
			//pLine = '';
			//continue
			// Add value to the icsObj
			// alert( digger + "['" + option + "'] = '" + value.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + "';"); // discuss at: http://phpjs.org/functions/addslashes
			// Handle attributes within the options
			if ( option.indexOf(";") != -1 ) {
				optAttribs = option.split(";");
				attribObj = "{'data':'" + value.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0')+"',";
				for ( y=1;optAttribs[y];y++ ) {
					optVal = optAttribs[y].split("=");
					attribObj += "'"+ICSParser.camCase(optVal[0]) + "':'" + ICSParser.trim(optVal[1].replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0')) + "'"; // Remove line breaks - Bug fix #000002
					if ( optAttribs[y+1] ) attribObj += ","
				}
				attribObj += "}";
				//alert( digger + "." + ICSParser.camCase(optAttribs[0]) + " = " + attribObj );
				eval( digger + "." + ICSParser.camCase(optAttribs[0]) + " = " + attribObj );
			} else {
				//alert( digger + "['" + option + "'] = '" + value.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + "';"); // discuss at: http://phpjs.org/functions/addslashes
				eval( digger + "." + ICSParser.camCase(option) + " = '" + value.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + "';"); // discuss at: http://phpjs.org/functions/addslashes	
				
				// Reset pLine, if data is added to calendar object.
			}
			pLine = '', option = '', value = '';
		}
		return icsObj
	};

})();
