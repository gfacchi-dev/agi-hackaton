import ollama
def main():
    response = ollama.generate(
        model='alibayram/medgemma:27b',
        prompt='Explain photosynthesis in simple terms.'
    )
    print(response.response)

if __name__ == "__main__":
    main()
