import requests
import sys
import json
from datetime import datetime

class XAUAutoTraderAPITester:
    def __init__(self, base_url="https://xau-autotrader.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = self.session.headers.copy()
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_auth_me_without_session(self):
        """Test /auth/me without session (should fail)"""
        return self.run_test("Auth Me (No Session)", "GET", "auth/me", 401)

    def test_create_mock_session(self):
        """Create a mock session for testing (simulating Emergent auth)"""
        print("\n🔍 Creating mock session for testing...")
        
        # For testing purposes, we'll simulate a session creation
        # In real scenario, this would come from Emergent OAuth flow
        mock_session_data = {
            "session_id": f"test_session_{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "Create Session (Mock)", 
            "POST", 
            "auth/session", 
            200,  # Expecting 200 for successful session creation
            data=mock_session_data
        )
        
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   Session token obtained: {self.session_token[:20]}...")
            return True
        else:
            print("   Note: Mock session creation failed (expected with real Emergent auth)")
            return False

    def test_auth_me_with_session(self):
        """Test /auth/me with session"""
        if not self.session_token:
            print("⚠️  Skipping - No session token available")
            return False
        return self.run_test("Auth Me (With Session)", "GET", "auth/me", 200)

    def test_market_scan(self):
        """Test market analysis scan"""
        if not self.session_token:
            print("⚠️  Skipping - No session token available")
            return False
        return self.run_test("Market Scan", "GET", "analysis/scan", 200)

    def test_current_trade(self):
        """Test get current trade"""
        if not self.session_token:
            print("⚠️  Skipping - No session token available")
            return False
        return self.run_test("Get Current Trade", "GET", "trades/current", 200)

    def test_trade_history(self):
        """Test get trade history"""
        if not self.session_token:
            print("⚠️  Skipping - No session token available")
            return False
        return self.run_test("Get Trade History", "GET", "trades/history", 200)

    def test_stats(self):
        """Test get statistics"""
        if not self.session_token:
            print("⚠️  Skipping - No session token available")
            return False
        return self.run_test("Get Statistics", "GET", "stats", 200)

    def test_update_trade_status(self):
        """Test updating trade status"""
        if not self.session_token:
            print("⚠️  Skipping - No session token available")
            return False
        
        # First get current trade to get trade ID
        success, current_trade = self.run_test("Get Current Trade for Update", "GET", "trades/current", 200)
        
        if success and current_trade and current_trade.get('id'):
            trade_id = current_trade['id']
            # Test updating to Active status
            return self.run_test(
                "Update Trade Status", 
                "PUT", 
                f"trades/{trade_id}/status", 
                200,
                data={"status": "Active"}
            )
        else:
            print("⚠️  No current trade found to update")
            return False

    def test_logout(self):
        """Test logout"""
        if not self.session_token:
            print("⚠️  Skipping - No session token available")
            return False
        return self.run_test("Logout", "POST", "auth/logout", 200)

def main():
    print("🚀 Starting XAU SMC Auto Trader API Tests")
    print("=" * 50)
    
    tester = XAUAutoTraderAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Auth Me (No Session)", tester.test_auth_me_without_session),
        ("Create Mock Session", tester.test_create_mock_session),
        ("Auth Me (With Session)", tester.test_auth_me_with_session),
        ("Market Scan", tester.test_market_scan),
        ("Current Trade", tester.test_current_trade),
        ("Trade History", tester.test_trade_history),
        ("Statistics", tester.test_stats),
        ("Update Trade Status", tester.test_update_trade_status),
        ("Logout", tester.test_logout),
    ]
    
    print(f"\n📋 Running {len(tests)} test categories...")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())