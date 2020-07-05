# Using JsRender templates with Flask

## Getting started

```
$ git clone https://github.com/elucidium/jsrender-flask-demo.git
$ cd jsrender-flask-demo
$ pipenv run flask run
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
 ```

Upon opening <http://127.0.0.1:5000/>, the following page is displayed.

![Screenshot of the output.](/images/result.png)

 ## Introduction

 This is a short project to demonstrate the integration of [JsRender templates](https://www.jsviews.com/) with Flask. There were a few key challenges along the way.

 1. **JsRender templates are difficult to separate from the base HTML file** without dealing with Node.js and npm, but lend greater flexibility than Jinja templates.
 2. If JsRender templates are kept at the bottom of an HTML file, **Jinja doesn't deal well with JsRender syntax** for template variables (i.e. the usage of `{{:variable}}` in JsRender templates vs. `{{variable}}` in Jinja). Jinja can't be avoided completely, because the first page to be loaded by Flask has to be a Jinja template (even if it has no Jinja variables, as is the case with this demo).
 3. **It's much easier to read local files with Python than with Javascript**, so we can request the templates from a JS script using a GET call.
 4. GET calls are asynchronous, and sometimes JsRender templates can depend on each other, so **they need to load in a specific order**.

 ## Main takeaways

 JsRender templates can be loaded into a script by passing JSON objects between Flask and Javascript's Fetch API. Consider the following two code excerpts (from [`app.py`](app.py) and [`static/js/script.js`](static/js/script.js) respectively).

 ```python
 @app.route('/get-template/<id>')
def get_template(id):
    with open('templates/' + id + '.html', 'r') as tmpl_file:
        return jsonify({'template': tmpl_file.read()})
```
This reads a JsRender template from the `templates` directory, wraps the resulting string in a JSON object, and returns the object.

```javascript
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
```
This calls the Fetch API, parses the response into a JSON object, then extracts the template string. This string is subsequently converted into a template, rendered on the `data` passed in, and sets the HTML element selected by `selector` to contain the output.

**The optional `continuation` parameter is used when certain template renders have to occur in order.** In the context of this demo, the middle row is loaded first into the HTML of the container with ID `#result`. The top row is then prepended and the bottom row appended to the container, and finally the three `<p>`s in the middle row are added to the row's `#contents`.

The code that renders the entire page is as follows. (`prepend_template` and `append_template` are very similar to `html_template` as seen above, except they manipulate the output using `$(selector).prepend(output);` and `$(selector).append(output);` respectively.)
```javascript
// data arguments previously initialized
html_template("flexible-row", "#result", html_flexible_row_data, () => {
    prepend_template("default-row", "#result", prepend_row_data, () => {
        append_template("default-row", "#result", append_row_data, () => {
            // this call has no continuation, since it's the last in the chain
            html_template("content-element", "#contents", flexible_row_contents);
        });
    });
});
```
*Note: this can quickly devolve into [callback hell](http://callbackhell.com/) (and arguably it already has in the above example...). This is already alleviated as much as possible by the `.then`s in the helper functions. There doesn't seem to be another way to force "synchronous" sequential execution of multiple function calls. If there is a cleaner way, please let me know!*

As a result of the above, the four specified templates will always render in the given order, as seen in the console output below. Crucially, this order matters because the results of rendering the `content-element` template are appended to `#contents`, which is found in the `flexible-row` template.

```
loaded flexible-row and set HTML of #result (script.js:19:21)
loaded default-row and prepended to #result (script.js:63:21)
loaded default-row and appended to #result (script.js:41:21)
loaded content-element and set HTML of #contents (script.js:19:21)
```

## Implementation

Refer to the code (in particular [`app.py`](app.py) and [`static/js/script.js`](static/js/script.js)) for extensive explanatory comments.

## Sources

I'm very new to working with Flask, in particular communicating information between two different program languages using JSON, so the following two repositories were very helpful for me while figuring out this solution.

- [python-flask-with-javascript](https://github.com/jitsejan/python-flask-with-javascript)
- [talking-between-python-and-js](https://github.com/healeycodes/talking-between-python-and-js)
