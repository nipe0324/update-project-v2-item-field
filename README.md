# Update Project V2 Item Field

A GitHub Actions to update the field of a GitHub project v2 item.

## Use Case

- Set current iteration after open an issue
- After requesting a review, change the status to "In Review".
- Calculate "Time to Close Days" to handle project management.

## Example Usage

### Set current iteration after open an issue

```yml
name: Set current iteration
on:
  issues:
    types: [opened]

jobs:
  set-iteration:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Get current iteration
        id: current-iteration
        # Note: Default timezone is UTC. Use TZ env to change timezone.
        run: echo "title=$(date --date='last monday' +'%Y-%m-%d')" >> $GITHUB_OUTPUT

      - name: Set current iteration
        uses: nipe0324/update-project-v2-item-field@v2.0.0
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          field-name: "Iteration"
          # Each iteration title is formatted as "YYYY-MM-DD"
          field-value: "${{ steps.current-iteration.outputs.title }}"
```

### After requesting a review, change the status to "In Review"

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
        uses: nipe0324/update-project-v2-item-field@v2.0.0
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          field-name: "Status"
          field-value: "In Review"
```

### Calculate "Development Days" to handle project management

```yml
name: Project Lead Time Automation
on:
  schedule:
    - cron: '* 2 * * 1-5' # Note: timezone is UTC
  issues:
    types: [closed]

jobs:
  lead-time-automation:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Get current date
        id: current-date
        # Note: Default timezone is UTC. Use TZ env to change timezone.
        run: |
          echo "date=$(date +'%Y-%m-%d')" >> $GITHUB_OUTPUT

      - name: Set "Start Date" when "In Progress" issue
        # Note: Item move event is not triggered now (2024/02)
        if: ${{ github.event.schedule }}
        uses: nipe0324/update-project-v2-item-field@v2.0.0
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          all-items: true
          skip-update-script: |
            const isIssue = item.type === 'ISSUE'
            const startDate = item.fieldValues['Start Date']
            const status = item.fieldValues['Status']

            return !isIssue || !!startDate || status !== 'In Progress'
          field-name: "Start Date" # Field Type: Date
          field-value: "${{ steps.current-date.outputs.date }}"

      - name: Set "Start Date" when issue opened
        if: ${{ github.event.action == 'opened'}}
        uses: nipe0324/update-project-v2-item-field@v2.0.0
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          field-name: "Start Date" # Field Type: Date
          field-value: "${{ steps.current-date.outputs.date }}"

      - name: Set "End Date" when issue closed
        if: ${{ github.event.action == 'closed'}}
        uses: nipe0324/update-project-v2-item-field@v2.0.0
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          field-name: "End Date" # Field Type: Date
          field-value: "${{ steps.current-date.outputs.date }}"

      - name: Calculate "Development Days" when issue closed
        if: ${{ github.event.action == 'closed'}}
        uses: nipe0324/update-project-v2-item-field@v2.0.0
        with:
          project-url: https://github.com/orgs|users/<ownerName>/projects/<projejctNumer>
          github-token: ${{ secrets.UPDATE_PROJECT_V2_PAT }}
          field-name: "Development Days" # Field Type: Number
          # Note: you can access `context` and `item`. see `type AsyncFunctionArguments`.
          field-value-script: |
            const developmentDays = item.fieldValues['Development Days']
            if (developmentDays) {
              return developmentDays
            }

            const endDate = new Date(item.fieldValues['End Date'])
            const startDate = new Date(item.fieldValues['Start Date'] ?? endDate)
            const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
            const days = Math.round(diff)
            return days === 0 ? 0.5 : days // `days === 0` means less than 1 day
```

References

- GitHub Actions Triggers: <https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows>
- GitHub Actions Contexts: <https://docs.github.com/en/actions/learn-github-actions/contexts>
- workflow events and payload: <https://docs.github.com/en/webhooks/webhook-events-and-payloads>

## Inputs

- `project-url` **(required)** is the URL of the GitHub project v2 to update item field.
  _eg: `https://github.com/orgs|users/<ownerName>/projects/<projectNumber>`_
- `github-token` **(required)** is a [personal access
  token](https://github.com/settings/tokens/new) with `repo` and `project` scopes. [more detail](#tokens)
- `field-name` **(required)** is a field name of the project v2 item to update.
  - note: Supported field types are `text`, `number`, `date`, `single_select` and `iteration`.
- `field-value` **(conditionally required)** is a field value of the project v2 item to update. (`field-value` or `field-value-script` is required)
- `field-value-script`: **(conditionally required)** is the script that returns the value of the field to update. (`field-value` or `field-value-script` is required)
- `condition-script`: **(optional)** is the script that returns a boolean value to determine whether to update the field. If the script returns `true`, the field will not be updated.
- `all-items`: **(optional)** updates all items in the project (default: false).

## Outputs

None

## FAQ

### Supported field types

The action supports the following field data types:

|  Field Type   |   GraphQL Type   |                             Description                        |
| :-----------: | :--------------: | :------------------------------------------------------------: |
|     Text      |     String       |         The literal string in the field. eg: `"Hello World"`   |
|    Number     |     Float        |      The string representation of a number. eg: `"100.1"`      |
|     Date      |      Date        |        The date in the YYYY-MM-DD format. eg: `"2024-01-01"`   |
| Single Select |     String       |      The name of the option (must be an exact match)           |
|   Iteration   |     String       |      The name of the iteration (must be an exact match)        |

### Tokens

Your token **has to be a classic PAT(Personal Access Token)**: the new fine-grained tokens do not work with the GraphQL API yet. You can create PAT from <https://github.com/settings/tokens/new>.

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
git tag v2.0.0
git push origin v2.0.0
```

Now, a release can be created from the branch containing the built action.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
