import bsCustomFileInput from 'bs-custom-file-input';
import { convertImageBlob } from '../lib/convert';
import { ImageMode } from '../lib/enums';
import { saveAs } from 'file-saver';
import { resolve } from 'path';
import { rejects } from 'assert';

function updateNameTextboxes() {
    const input = $("#customFile")[0];
    const $nameContainer = $(".name-container");
    const numExistingFields = $nameContainer.children().length;
    const totalLength = Math.max(numExistingFields, input.files.length);
    for(var i = 0; i < totalLength; i++) {
        if(i >= numExistingFields)
            $nameContainer.append(`<input type="text" name="name${i}" id="name${i}" class="form-control" placeholder="Variable name of image ${i+1}" style="height:unset">`);
        else if(i >= input.files.length) {
            $nameContainer.get(0).removeChild($nameContainer.children().get(i));
        }
    }
    $(".name-row").css("display", input.files.length > 0 ? "" : "none");
}

$(document).ready(function () {
    bsCustomFileInput.init();
    updateNameTextboxes();
});

$("#customFile").change(updateNameTextboxes);

$("#convert-button").on("click", async() => {
    $("#convert-button").attr("disabled", true);
    /** @type {HTMLInputElement} */
    const input = $("#customFile")[0];
    for(var i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        if(file) {
            const reader = new FileReader();
            await new Promise((resolve, reject) => {
                
                async function doConvert(blob) {
                    const imageName = $("#name" + i).val();
                    const imageString = await convertImageBlob(blob, { cf: ImageMode[$("#cf").val()], imageName: imageName, outName: imageName });
                    console.log(imageString);
                    var blob = new Blob([ imageString ], {type: "text/x-c;charset=utf-8"});
                    saveAs(blob, imageName + ".c");
                    resolve();
                }
                if($("#cf").val().startsWith("CF_RAW")) {
                    reader.readAsArrayBuffer(file);
                    reader.onload = function(e) {
                        console.log("loaded");
                        /** @type {ArrayBuffer} */
                        const buf = e.target.result;
                        doConvert(new Uint8Array(buf));
                    }
                } else {
                    reader.onload = function(e) {
                        var image = new Image();
                        image.onload = function() {
                            console.log("loaded");
                            doConvert(image);
                        };
    
                        image.onerror = function(e) {
                            reject(e);
                        };
                        image.src = e.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
    }
    $("#convert-button").removeAttr("disabled");
});

/* FIXME: temporary hack to fix setImmediate issue */
window.setImmediate = (fn) => setTimeout(fn, 0);