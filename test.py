import json

json_string = '[{"Frequency":1,"Total Duration":6.5,"Average Duration":6.5,"Max Duration":6.5,"Min Duration":6.5},{"Frequency":5,"Total Duration":59.950000003,"Average Duration":11.9900000006,"Max Duration":50.51666667,"Min Duration":2.083333333},{"Frequency":1,"Total Duration":1.75,"Average Duration":1.75,"Max Duration":1.75,"Min Duration":1.75},{"Frequency":1,"Total Duration":20.16666667,"Average Duration":20.16666667,"Max Duration":20.16666667,"Min Duration":20.16666667},{"Frequency":1,"Total Duration":1.283333333,"Average Duration":1.283333333,"Max Duration":1.283333333,"Min Duration":1.283333333},{"Frequency":1,"Total Duration":23.58333333,"Average Duration":23.58333333,"Max Duration":23.58333333,"Min Duration":23.58333333},{"Frequency":1,"Total Duration":2.116666667,"Average Duration":2.116666667,"Max Duration":2.116666667,"Min Duration":2.116666667},{"Frequency":1,"Total Duration":172.3333333,"Average Duration":172.3333333,"Max Duration":172.3333333,"Min Duration":172.3333333},{"Frequency":1,"Total Duration":2.75,"Average Duration":2.75,"Max Duration":2.75,"Min Duration":2.75},{"Frequency":1,"Total Duration":0.666666667,"Average Duration":0.666666667,"Max Duration":0.666666667,"Min Duration":0.666666667}]'

data = json.loads(json_string)

for item in data:
    print(item)
