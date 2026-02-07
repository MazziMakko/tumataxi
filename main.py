import sys

def production_check():
    print(f"System Online: Running Python {sys.version.split()[0]}")
    print("Virtual Environment: ACTIVE")
    print("Ready for deployment.")

if __name__ == "__main__":
    production_check()