from flask import Flask, jsonify, render_template
app = Flask(__name__)

@app.route('/')
def initialize_app():
    return render_template('index.html')

# opens JsRender template and returns it as a string in a JSON object
@app.route('/get-template/<id>')
def get_template(id):
    with open('templates/' + id + '.html', 'r') as tmpl_file:
        return jsonify({'template': tmpl_file.read()})

# returns data for the bottom row (for demonstration purposes)
@app.route('/get-bottom-row-data')
def get_bottom_row_data():
    return jsonify({
        "title": "bottom row",
        "contents": "This row was appended to the page."
    })

if __name__ == '__main__':
    app.run()