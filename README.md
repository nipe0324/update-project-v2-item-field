# Update Project V2 Item Field

A GitHub Actions to update the field of a GitHub project v2 item.

## Use Case

- After requesting a review, change the status to "In Review".
- Set Current Date to "Closed Date" field when the issue is closed.
- [WIP] Calculate "Time to Close Days" to handle project management.

## Example Usage

### After requesting a review, change the status to "In Review".

```yml
name: Update status to "In Review"
on:
  pull_request:
    types: [review_requested]

jobs:
  update-status:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Update status to "In Review"
        uses: nipe0324/update-project-v2-item-field@v1.0
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          field-name: "Status"
          field-value: "In Review"
```

### Set Current Date to "Closed Date" field when the issue is closed.

```yml
name: Set "Closed Date"
on:
  issues:
    types: [closed]

jobs:
  set-closed-date:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
       - name: Get current date
        id: current-date
        # Note: Default timezone is UTC. Use TZ env to change timezone.
        run: |
          echo "date=$(date +'%Y-%m-%d')" >> $GITHUB_OUTPUT

      - name: Set "Closed Date"
        uses: nipe0324/update-project-v2-item-field@main
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          field-name: "Closed Date"
          field-value: "${{ steps.current-date.outputs.date }}"
```

Reference: Github Actions Triggers: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows

## Inputs

- `project-url` **(required)** is the URL of the GitHub project v2 to update item field.
  _eg: `https://github.com/orgs|users/<ownerName>/projects/<projectNumber>`_
- `github-token` **(required)** is a [personal access
  token](https://github.com/settings/tokens/new) with `repo` and `project` scopes. [more detail](#tokens)
- `field-name` **(required)** is a field name of the project v2 item to update.
  _note: Supported field types are `text`, `number`, `date` and `single_select`._
- `field-value` **(required)** is a field value of the project v2 item to update.

## Outputs

- `item-id` is the ID of the project v2 updated item.

## FAQ

### Supported field types

The action supports the following field data types:

|  Field Type   |   GraphQL Type   |                             Description                        |
| :-----------: | :--------------: | :------------------------------------------------------------: |
|     Text      |     String       |         The literal string in the field. eg: `"Hello World"`   |
|    Number     |     Float        |      The string representation of a number. eg: `"100.1"`      |
|     Date      |      Date        |        The date in the YYYY-MM-DD format. eg: `"2024-01-01"`   |
| Single Select |     String       | The name of the option (must be an exact match)                |

### Tokens

Your token **has to be a classic PAT(Personal Access Token)**: the new fine-grained tokens do not work with the GraphQL API yet. You can create PAT from https://github.com/settings/tokens/new.

The token should have the following scopes:

- `repo`: needed read issues and PRs from private repositories. If you're using the action on a public repository, you can just use `public_repo` instead.
- `project`: needed to update project fields.

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

## Publish to a distribution branch

Actions are run from GitHub repositories, so we check in the packaged action in
the "dist/" directory.

```shell
npm run all
git tag v1.0.0
```

Now, a release can be created from the branch containing the built action.

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
