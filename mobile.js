//to display explanation
function openExplanation(){
	explanation.textContent = "Extensions like SynthPass are not yet supported on mobile devices. This page will make the password for a website on any device. Save it to Home Screen. For your protection, the input fields will be cleared after the password is synthesized, and the output field when it is copied to clipboard. Nothing you input will be sent out of your device or even stored locally."
}

//var hashiliOn = false;			//default to not showing hashili

//for showing and hiding text in the Password box
function showPwd(){
	if(masterPwd.type == "password"){
		masterPwd.type = "text";
		showPwdMode.src = "images/hide-24.png"
	}else{
		masterPwd.type = "password";
		showPwdMode.src = "images/eye-24.png"
	}
	keyStrength(masterPwd.value,true)
}

//to select the result
function copyOutput(){
  if(outputBox.textContent.trim() != ''){
    var range, selection;
    if(document.body.createTextRange){
        range = document.body.createTextRange();
        range.moveToElementText(outputBox);
        range.select()
    }else if (window.getSelection){
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(outputBox);
        selection.removeAllRanges();
        selection.addRange(range)
    }
	document.execCommand('copy');
	outputBox.textContent = '';
	helpMsg.textContent = "Output copied to clipboard"
  }
}

var websiteName;							//global in the popup, so global here also

//this part of the code is to synthesize passwords using the fields in the last Help item
function doStuff(e) {
	websiteName = siteName.value.toLowerCase();			//get all the data
	var	pwdStr = masterPwd.value,	
		serialStr = serial.value,
		lengthStr = pwdLength.value.replace(/ /g,'');
		
	if(!pwdStr){																//no password in box
		helpMsg.textContent = "Please enter your master Password";
		return
	}
	if(!websiteName){																//no website in box
		helpMsg.textContent = "Please enter the website name as name.suffix";
		return
	}
	var websiteParts = websiteName.split('.');
	if(websiteParts.length != 2 && !(websiteParts.length == 3 && websiteParts[2].length == 2)){
		helpMsg.textContent = "The website name should contain only two or three pieces of text with dots between them";
		return
	}
	if(websiteParts.length == 3 && websiteParts[1].length > 3) websiteName = websiteParts.slice(-2).join('.'); //correction for long STL
	
	//detect special in "length" box
	if(!lengthStr){												//default length is 44
		lengthStr = 44
	}else if(lengthStr.toLowerCase().match(/al/)){			//alphanumeric case
		var isAlpha = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}else if(lengthStr.toLowerCase().match(/pin|num/)){		//numeric case
		var isPin = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 4
		lengthStr = digits ? digits.join('') : 4
	}else{															//general case, which may include special characters
		var spChars = lengthStr.match(/[^A-Za-z0-9]/g);			//detect special characters and add them to the alphabet
		if(spChars) base = base62 + spChars.join('');
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}

	helpMsg.textContent = '';
	var blinker = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = 'PROCESSING';
	helpMsg.appendChild(blinker);
	
	setTimeout(function(){														//the rest after a 10 ms delay
		helpMsg.textContent = "Password synthesized. Copy it now.";
		outputBox.textContent = pwdSynth(pwdStr,serialStr,isPin,isAlpha).slice(0,lengthStr);
		masterPwd.value = '';
		siteName.value = '';
		websiteName = '';
		pwdLength.value = '';
		serial.value = '';
	},10);
}

//synthesizes a new password
function pwdSynth(pwd, serial, isPin, isAlpha){
	if(serial == '-' || serial == '+'){
		helpMsg.textContent = "Only synthesized passwords are supported by this app";
		return ''
	}else if(isPin){				//return only decimal digits, with equal probability
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/[AaBbC]/g,'0').replace(/[cDdEe]/g,'1').replace(/[FfGgH]/g,'2').replace(/[hIiJj]/g,'3').replace(/[KkLlM]/g,'4').replace(/[mNnOo]/g,'5').replace(/[PpQqR]/g,'6').replace(/[rSsTt]/g,'7').replace(/[UuVvW]/g,'8').replace(/[wXxYy]/g,'9').match(/[0-9]/g).join('')
	}else if(isAlpha){						//replace extra base64 characters with letters
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/\+/g,'a').replace(/\//g,'b').replace(/=/,'c')
	}else{
		if(base == base62){				//replace some base64 characters with default special characters
			return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/[+/=Aa]/g,'_').replace(/[BbCc]/,'!').replace(/[DdEe]/,'#')
		}else{								//change base in order to include the special characters, with equal probability
			return base.charAt(62) + changeBase(nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/=$/g,''), base64, base) 				//use at least the first of the characters on the list
		}
	}
}

//to display password strength
function pwdKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){doStuff()} else{
		 if(masterPwd.value){
			 keyStrength(masterPwd.value,true)
		 }else{
			 helpMsg.textContent = "Please enter the Master Password"
		 }
	}
}

//displays output password length
function outputKeyup(){
	helpMsg.textContent = "Output is " + outputBox.textContent.length + " characters long"
}

//makes 'pronounceable' hash of a string, so user can be sure the password was entered correctly
var vowel = 'aeiou',
	consonant = 'bcdfghjklmnprstvwxyz',
	hashiliTimer;
function hashili(msgID,string){
	var element = document.getElementById(msgID);
	clearTimeout(hashiliTimer);
	hashiliTimer = setTimeout(function(){
		if(!string.trim()){
			element.innerText += ''
		}else{
			var code = nacl.hash(nacl.util.decodeUTF8(string.trim())).slice(-2),			//take last 4 bytes of the SHA512		
				code10 = ((code[0]*256)+code[1]) % 10000,		//convert to decimal
				output = '';

			for(var i = 0; i < 2; i++){
				var remainder = code10 % 100;								//there are 5 vowels and 20 consonants; encode every 2 digits into a pair
				output += consonant[Math.floor(remainder / 5)] + vowel[remainder % 5];
				code10 = (code10 - remainder) / 100
			}
//	return output
			element.textContent += '\r\n' + output
		}
	}, 1000);						//one second delay to display hashili
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Key
function wiseHash(pwd,salt){
	var iter = keyStrength(pwd,false),
		secArray = new Uint8Array(32),
		keyBytes;

	scrypt(pwd,salt,iter,8,32,0,function(x){keyBytes=x;});		//does a variable number of rounds of scrypt, using nacl libraries

	for(var i=0;i<32;i++){
			secArray[i] = keyBytes[i]
	}
	return secArray
}

//The rest is modified from WiseHash. https://github.com/fruiz500/whisehash
//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display) {
	if(pwd){
		var entropy = entropycalc(pwd);
	}else{
		document.getElementById('helpMsg').textContent = 'Type your Master Password in the box';
		return
	}
	
  if(display){
	if(entropy == 0){
		var msg = 'This is a known bad password!';
		var colorName = 'magenta'
	}else if(entropy < 20){
		var msg = 'Terrible!';
		var colorName = 'magenta'
	}else if(entropy < 40){
		var msg = 'Weak!';
		var colorName = 'red'
	}else if(entropy < 60){
		var msg = 'Medium';
		var colorName = 'darkorange'
	}else if(entropy < 90){
		var msg = 'Good!';
		var colorName = 'green'
	}else if(entropy < 120){
		var msg = 'Great!';
		var colorName = 'blue'
	}else{
		var msg = 'Overkill  !';
		var colorName = 'cyan'
	}
  }

	var iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20
		
	msg = 'entropy ' + Math.round(entropy*100)/100 + ' bits. ' + msg;
	
	if(display){
		helpMsg.textContent = msg;
		helpMsg.style.color = colorName;
		hashili('helpMsg',pwd)	
	}
	return iter
};

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(pwd){

//find the raw Keyspace
	var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
	var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
	var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
	var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
	var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

	pwd = pwd.replace(/\s/g,'');										//no credit for spaces

	var Ncount = 0;
	if(numberRegex.test(pwd)){
		Ncount = Ncount + 10;
	}
	if(smallRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(capRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(base64Regex.test(pwd)){
		Ncount = Ncount + 2;
	}
	if(otherRegex.test(pwd)){
		Ncount = Ncount + 31;											//assume only printable characters
	}

//start by finding words that might be on the blacklist (no credit)
	var pwd = reduceVariants(pwd);
	var wordsFound = pwd.match(blackListExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = pwd.match(wordListExp);									//array containing words found on the regular wordlist
	if(wordsFound){
		wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
		var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
		}
	}else{
		var foundLength = 0;
	}

	pwd = pwd.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

	if(pwd != ''){
		return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}else{
		return (foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u');
}

//for cases with user-specified special characters
var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
	base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
	base = base62;

//from http://snippetrepo.com/snippets/bignum-base-conversion, by kybernetikos
function changeBase(number, inAlpha, outAlpha) {
	var targetBase = outAlpha.length,
		originalBase = inAlpha.length;
    var result = "";
    while (number.length > 0) {
        var remainingToConvert = "", resultDigit = 0;
        for (var position = 0; position < number.length; ++position) {
            var idx = inAlpha.indexOf(number[position]);
            if (idx < 0) {
                throw new Error('Symbol ' + number[position] + ' from the'
                    + ' original number ' + number + ' was not found in the'
                    + ' alphabet ' + inAlpha);
            }
            var currentValue = idx + resultDigit * originalBase;
            var remainDigit = Math.floor(currentValue / targetBase);
            resultDigit = currentValue % targetBase;
            if (remainingToConvert.length || remainDigit) {
                remainingToConvert += inAlpha[remainDigit];
            }
        }
        number = remainingToConvert;
        result = outAlpha[resultDigit] + result;
    }
    return result;
}

//add event listeners
window.onload = function() {
	okBtn.addEventListener('click', doStuff);								//execute
	showPwdMode.addEventListener('click', showPwd);
	copyBtn.addEventListener('click', copyOutput);
	explanation.addEventListener('click', openExplanation);
	
	masterPwd.addEventListener('keyup', pwdKeyup, false);
	outputBox.addEventListener('keyup', outputKeyup, false)
}