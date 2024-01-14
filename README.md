# Update Project V2 Item Field

Update the field of a project v2 item.

Notice: Thie action is in progress.

## Use Case

- After requesting a review, change the status to "In Review".
- Set Current Date to "Closed Date" field when the issue is closed.
- Calculate "Time to Close Days" to handle project management.

## Example Usage

TODO

## Inputs

- `project-url` **(required)** is the URL of the GitHub project v2 to update item field.
  _eg: `https://github.com/orgs|users/<ownerName>/projects/<projectNumber>`_
- `github-token` **(required)** is a [personal access
  token](https://github.com/settings/tokens/new) with `repo` and `project` scopes.
- `field-name` **(required)** is a field name of the project v2 item to update.

## Outputs

TODO

## Development

```shell
git clone https://github.com/nipe0324/update-project-v2-item-field
cd update-project-v2-item-field
npm install
```

Run all tests (format, lint, test, coverage, package)

```shell
npm run all
```
