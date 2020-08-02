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

 1. **JsRender templates are difficult to separate from the base HTML file** without [dealing with Node.js and npm](https://www.jsviews.com/#search?s=load%20templates&l=node/browserify), but lend greater flexibility than Jinja templates.
 2. If JsRender templates are kept at the bottom of an HTML file, **Jinja doesn't deal well with JsRender syntax** for template variables (i.e. the usage of `{{:variable}}` in JsRender templates vs. `{{variable}}` in Jinja).<sup>1</sup> Jinja can't be avoided completely because the first page to be loaded by Flask has to be a Jinja template (even if it has no Jinja variables, as is the case with this demo).
 3. **It's much easier to read local files with Python than with Javascript**, so we can request the templates from a JS script using a GET call.
 4. GET calls are asynchronous, and sometimes JsRender templates can depend on each other, so **they need to load in a specific order**.

<sup>[1] It's worth noting that [delimiters can be modified](https://www.jsviews.com/#settings/delimiters), but separating templates from the base file is useful anyways for the sake of modularity.</sup>

 ## Main takeaways

### Loading templates
 **JsRender templates can be loaded into a script by passing JSON objects between Flask and Javascript's Fetch API.** Consider the following two code excerpts.

#### [`app.py`](app.py)
 ```python
 @app.route('/get-template/<id>')
def get_template(id):
    with open('templates/' + id + '.html', 'r') as tmpl_file:
        return jsonify({'template': tmpl_file.read()})
```
This returns a `Promise` that, when `resolve`d, reads a JsRender template from the `templates` directory, wraps the resulting string in a JSON object, and returns the object.

#### [`static/js/script.js`](static/js/script.js)
```javascript
function html_template(id, selector, data) {
    return new Promise(resolve => {
        fetch('/get-template/' + id)
        .then(function (response) {
            return response.json();
        }).then(function (json) {
            var template = $.templates(json.template);
            var output = template.render(data);
            $(selector).html(output);
            console.log("loaded " + id + " and set HTML of " + selector);
            resolve();
        });
    });
}
```
This calls the Fetch API, parses the response into a JSON object, then extracts the template string. This string is subsequently converted into a template and rendered on the `data` passed in, after which the HTML element selected by `selector` is set to contain the output.

### Enforcing render order
**If templates depend upon each other, the order in which they load on the page can be enforced using `async`/`await`.** The code that renders the entire page is as follows. (`prepend_template` and `append_template` are very similar to `html_template` as seen above, except they manipulate the output using `$(selector).prepend(output);` and `$(selector).append(output);` respectively.)

#### [`static/js/script.js`](static/js/script.js)
```javascript
async function show_page() {
    // ...
    // data arguments previously initialized
    await html_template("flexible-row", "#result", html_flexible_row_data);
    await prepend_template("default-row", "#result", prepend_row_data);
    await append_template("default-row", "#result", append_row_data);
    await html_template("content-element", "#contents", flexible_row_contents);
}

```
*Note: as of 08/01/2020, `html_template`, `prepend_template`, and `append_template` were modified to return `Promise`s, therefore avoiding any chances of the [callback hell](http://callbackhell.com/) typical of older asynchronous Javascript. (I didn't initially understand `async`/`await` when creating this repository... whoops! It's worth noting, though, that `Promise`s aren't supported at all in IE, if that's a necessary consideration for the use case.*


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

As of creating this repository I was very new to working with Flask, in particular communicating information between two different program languages using JSON, so the following two repositories were very helpful for me while figuring out this solution.

- [python-flask-with-javascript](https://github.com/jitsejan/python-flask-with-javascript)
- [talking-between-python-and-js](https://github.com/healeycodes/talking-between-python-and-js)
