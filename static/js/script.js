/**
 * Uses Flask to read JsRender template from file, render the template on
 * a set of data, and set a target element's HTML to the output.
 * @param {string} id The name of the JsRender template (without .html suffix)
 * @param {string} selector The CSS selector for the target element
 * @param {*} data The data on which the template will be rendered (can be
 * either a single Object or an Array of Objects)
 * @param {*} continuation (optional) The next function to run (useful for when
 * specific renderings depend on each other and must occur in order)
 */
function html_template(id, selector, data, continuation) {
    fetch('/get-template/' + id)
        .then(function (response) {
            return response.json();
        }).then(function (json) {
            var template = $.templates(json.template);
            var output = template.render(data);
            $(selector).html(output);
            console.log("loaded " + id + " and set HTML of " + selector);
        }).then(continuation);
}

/**
 * Uses Flask to read JsRender template from file, render the template on
 * a set of data, and append the output to a target element.
 * @param {string} id The name of the JsRender template (without .html suffix)
 * @param {string} selector The CSS selector for the target element
 * @param {*} data The data on which the template will be rendered (can be
 * either a single Object or an Array of Objects)
 * @param {*} continuation (optional) The next function to run (useful for when
 * specific renderings depend on each other and must occur in order)
 */
function append_template(id, selector, data, continuation) {
    fetch('/get-template/' + id)
        .then(function (response) {
            return response.json();
        }).then(function (json) {
            var template = $.templates(json.template);
            var output = template.render(data);
            $(selector).append(output);
            console.log("loaded " + id + " and appended to " + selector);
        }).then(continuation);
}

/**
 * Uses Flask to read JsRender template from file, render the template on
 * a set of data, and prepend the output to a target element.
 * @param {string} id The name of the JsRender template (without .html suffix)
 * @param {string} selector The CSS selector for the target element
 * @param {*} data The data on which the template will be rendered (can be
 * either a single Object or an Array of Objects)
 * @param {*} continuation (optional) The next function to run (useful for when
 * specific renderings depend on each other and must occur in order)
 */
function prepend_template(id, selector, data, continuation) {
    fetch('/get-template/' + id)
        .then(function (response) {
            return response.json();
        }).then(function (json) {
            var template = $.templates(json.template);
            var output = template.render(data);
            $(selector).prepend(output);
            console.log("loaded " + id + " and prepended to " + selector);
        }).then(continuation);
}

/**
 * Renders all the elements onto index.html for this demonstration.
 */
function show_page() {
    // Data is passed into JsRender templates as JSON objects.
    var prepend_row_data = {
        "title": "top row",
        "contents": "This row was prepended to the page."
    };    
    /***
     * For demonstration purposes, this data is fetched through a request that
     * app.py fulfills (note that the default method is a GET request).
     */
    var append_row_data;
    fetch('/get-bottom-row-data')
        .then(function (response) {
            return response.json();
        }).then(function (json) {
            append_row_data = json;
        });
    // This row template only takes in a title. We'll populate the contents later.
    var html_flexible_row_data = {
        "title": "middle row"
    };
    // Data can also be passed into JsRender templates as an array of JSON objects.
    var flexible_row_contents = [
        {"contents": "This line is the first of a list of rendered JsRender templates."},
        {"contents": "This particular template is simple: just a paragraph tag."},
        {"contents": "However, it demonstrates the ease of using a single JsRender template to generate multiple HTML elements at once."}
    ]
    /***
     * Uses the first three helper functions in this file to populate the page.
     * Note the usage of continuations to enforce the order in which elements
     * are loaded onto the page.
     */
    html_template("flexible-row", "#result", html_flexible_row_data, () => {
        prepend_template("default-row", "#result", prepend_row_data, () => {
            append_template("default-row", "#result", append_row_data, () => {
                /***
                 * Note that the continuation parameter is optional, and this
                 * call to html_template has no continuation.
                 */
                html_template("content-element", "#contents", flexible_row_contents);
            });
        });
    });
}

// Runs the above function upon the completed loading of index.html.
$(document).ready(show_page);